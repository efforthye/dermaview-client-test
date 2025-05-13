export const Dialog = ({ message }: { message: string }) => {
  return (
    <div
      className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-500 translate-y-0 opacity-100 w-[60vw] h-auto flex items-center justify-center`}
    >
      <div className="bg-white p-4 rounded">
        <p>{message}</p>
      </div>
    </div>
  );
};
