import got from "got";

/** Object containing the oauth token returned by Canvas */
interface CanvasTokenSet {
  /** Oatuh2 Token used for making authorized requests to Canvas */
  // eslint-disable-next-line camelcase
  access_token: string;

  /** Type of token */
  // eslint-disable-next-line camelcase
  token_type: "Bearer";

  /** Object containing user ID and user name */
  user: {
    /** User ID */
    id: number;

    /** User name */
    name: string;
  };

  /** Oauth2 refresh token */
  // eslint-disable-next-line camelcase
  refresh_token: string;

  /** Seconds until the access token expires */
  // eslint-disable-next-line camelcase
  expires_in: number;
}

/** Query parameters sent by Canvas to the "redirect URL" */
interface OauthQueryParams {
  code?: string;
  state?: string;
  error?: "access_denied";
}

export default class CanvasOauth {
  clientId: string;

  clientSecret: string;

  redirectUri: string;

  apiUrl: string;

  constructor(
    apiUrl: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ) {
    this.apiUrl = apiUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Creates the Oauth2 authorization URL and returns it. The user must be redirected to this URL
   *
   * @param param0 Options to create the url
   * @param param0.state A secret that will be sent to and returned back from Canvas
   *   to ensure that you are authorizing the correct user
   * @param param0.scope A list of scopes that the token will have
   */
  authorizationUrl({
    state,
    scope,
  }: { state?: string; scope?: string } = {}): URL {
    const fullUrl = new URL("/login/oauth2/auth", this.apiUrl);
    fullUrl.searchParams.set("client_id", this.clientId);
    fullUrl.searchParams.set("response_type", "code");
    fullUrl.searchParams.set("redirect_uri", this.redirectUri);

    if (scope) {
      fullUrl.searchParams.set("scope", scope);
    }
    if (state) {
      fullUrl.searchParams.set("state", state);
    }

    return fullUrl;
  }

  /**
   * Exchange some parameters with a Canvas access token.
   *
   * @param queryParams Query parameters sent by Canvas as part of the GET request. Usually `req.query`
   * @param actualState The state included in the redirect URL during Oauth step 1.
   *   If the `queryParams` does not include the same value, this function will throw
   * @returns An object containing the access token among other data
   */
  async createTokens(
    queryParams: OauthQueryParams,
    actualState?: string
  ): Promise<CanvasTokenSet> {
    if (queryParams.error === "access_denied") {
      throw new Error();
    }

    if (!queryParams.code) {
      throw new Error();
    }

    if (actualState && queryParams.state !== actualState) {
      throw new Error();
    }

    return got
      .post<CanvasTokenSet>("login/oauth2/token", {
        prefixUrl: this.apiUrl,
        responseType: "json",
        json: {
          grant_type: "authorization_code",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code: queryParams.code,
        },
      })
      .then((response) => response.body)
      .catch((err) => {
        console.error(err);
        throw err;
      });
  }

  async renewTokens(refreshToken: string) {
    return got.post("login/oauth2/token", {
      prefixUrl: this.apiUrl,
      responseType: "json",
      json: {
        grant_type: "refresh_token",
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        refresh_token: refreshToken,
      },
    });
  }
}
