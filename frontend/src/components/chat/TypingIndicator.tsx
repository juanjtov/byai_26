export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-ivory/10 px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-copper rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 bg-copper rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 bg-copper rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}
