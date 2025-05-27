import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prism-themes/themes/prism-one-light.css";

const hightlightWithLineNumbers = (input: string, language: string) =>
  highlight(input, language)
    .split("\n")
    .map((line, i) => `<span class='editorLineNumber'>${i + 1}</span>${line}`)
    .join("\n");

export const CodeEditor = ({
  customConfig,
  handleConfigChange,
  error,
}: {
  customConfig: string;
  handleConfigChange: (value: string) => void;
  error: boolean;
}) => {
  return (
    <div className="flex flex-col h-full w-full relative rounded-sm bg-white border">
      {error && (
        <div
          className="bg-red-400 border border-red-500 text-xs text-white w-fit absolute z-100 top-2 right-5 px-2 py-1
          min-w-[100px] flex items-center justify-center animate-pulse"
        >
          Invalid JSON
        </div>
      )}
      <div className="overflow-scroll h-full z-10 overflow-x-hidden">
        <style>
          {`
        .editorLineNumber {
          position: absolute;
          left: 0px;
          color: #666;
          text-align: right;
          width: 25px;
          font-weight: 100;
        }

      `}
        </style>
        <Editor
          value={customConfig}
          onValueChange={handleConfigChange}
          highlight={(code) => hightlightWithLineNumbers(code, languages.js)}
          padding={10}
          textareaClassName="focus:outline-none !pl-12"
          preClassName="!pl-12"
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            // caretColor: "white",
            // color: "white",
          }}
        />
      </div>
    </div>
  );
};

// [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#ffffff] [&::-webkit-scrollbar-track]:rounded-md [&::-webkit-scrollbar-thumb]:bg-white [&::-webkit-scrollbar-thumb]:rounded-md
