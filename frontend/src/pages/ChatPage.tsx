import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import CanvasContextInput from '../components/CanvasContextInput';
import CanvasTokenInput from '../components/CanvasTokenInput';
import { useChat } from '../contexts/ChatContext';

const ChatPage = () => {
  const { clearChat } = useChat();

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <div className="w-full md:w-3/4 flex flex-col">
          <div className="flex-grow overflow-hidden">
            <ChatWindow />
          </div>
        </div>
        <div className="w-full md:w-1/4 border-l">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Options</h2>
            <button
              onClick={clearChat}
              className="btn btn-secondary w-full mb-4"
            >
              Clear Chat
            </button>
          </div>
          <CanvasTokenInput />
          <CanvasContextInput />
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 