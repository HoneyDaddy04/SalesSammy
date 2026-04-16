import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, List, ListOrdered, Link2, Heading2, Undo, Redo, Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallback } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

const MenuButton = ({ active, onClick, children, title }: {
  active?: boolean; onClick: () => void; children: React.ReactNode; title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={cn(
      "w-7 h-7 rounded flex items-center justify-center transition-colors",
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({ content, onChange, placeholder = "Start writing...", className, editable = true }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[120px] px-4 py-3",
          "prose-headings:font-display prose-headings:font-semibold",
          "prose-p:text-sm prose-p:leading-relaxed prose-p:text-foreground",
          "prose-li:text-sm prose-li:text-foreground",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-primary/30",
          "prose-a:text-primary",
        ),
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("rounded-lg border border-border bg-background overflow-hidden", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-secondary/30 flex-wrap">
          <MenuButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
            <Heading2 className="w-3.5 h-3.5" />
          </MenuButton>
          <MenuButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </MenuButton>
          <MenuButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </MenuButton>
          <div className="w-px h-4 bg-border mx-1" />
          <MenuButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </MenuButton>
          <MenuButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </MenuButton>
          <MenuButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
            <Quote className="w-3.5 h-3.5" />
          </MenuButton>
          <div className="w-px h-4 bg-border mx-1" />
          <MenuButton active={editor.isActive("link")} onClick={setLink} title="Add link">
            <Link2 className="w-3.5 h-3.5" />
          </MenuButton>
          <div className="flex-1" />
          <MenuButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
            <Undo className="w-3.5 h-3.5" />
          </MenuButton>
          <MenuButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
            <Redo className="w-3.5 h-3.5" />
          </MenuButton>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
