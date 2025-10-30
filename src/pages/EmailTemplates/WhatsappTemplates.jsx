import React, { useState, useRef, useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import "../../styles/template.css";
import {
  useCreateEmailMutation,
  useGetEmailByModuleQuery,
  useGetParametersQuery,
  useUpdateEmailMutation,
} from "../../api/emailAndWhatsappApi";
import Button from "../../components/ui/Button";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const modules = [
  { value: 1, label: "Order" },
  { value: 2, label: "Invoice" },
  { value: 3, label: "SalesReturn" },
];

const WhatsappTemplates = () => {
  const { hasMultipleLocations } = useSelector((state) => state.auth);
  const [selectedModule, setSelectedModule] = useState("Order");
  const [subject, setSubject] = useState("");
  const [selectedParamIds, setSelectedParamIds] = useState([]);
  const [activeField, setActiveField] = useState("editor");
  const [includeAttachment, setIncludeAttachment] = useState(false);
  const [editorCharCount, setEditorCharCount] = useState(0);
  const subjectInputRef = useRef(null);

  const { data: templateData, isLoading: isTemplateLoading } =
    useGetEmailByModuleQuery({
      module: selectedModule,
      companyId: parseInt(hasMultipleLocations[0]),
    });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      BulletList.configure({ keepMarks: true, keepAttributes: false }),
      OrderedList.configure({ keepMarks: true, keepAttributes: false }),
      ListItem,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content:
      templateData?.data?.WATemplate ||
      "<p>Start composing your email template...</p>",
    onFocus: () => setActiveField("editor"),
    onUpdate: ({ editor }) => {
      setEditorCharCount(editor.getText().length);
      updateSelectedParamIds(editor.getText(), subject);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose lg:prose-xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  });

  const { data: paramsData, isLoading: isParamsLoading } =
    useGetParametersQuery({ type: selectedModule });
  const [createEmail, { isLoading: isEmailCreating }] =
    useCreateEmailMutation();
  const [updateEmail, { isLoading: isUpdating }] = useUpdateEmailMutation();
  
  // Prefill state with template data
  useEffect(() => {
    if (templateData?.data[0]) {
      // Set attachment
      setIncludeAttachment(!!templateData?.data[0].WATemplate);

      // Parse ParamID (string like "3,2" to array [3, 2])
      if (templateData?.data[0].ParamID) {
        const paramIds = templateData?.data[0].ParamID.split(",").map((id) =>
          parseInt(id.trim())
        );
        setSelectedParamIds(paramIds);
      }

      // Update editor content (already set in useEditor, but ensure it's updated)
      if (editor && templateData?.data[0].WATemplate) {
        editor.commands.setContent(templateData?.data[0].WATemplate);
        setEditorCharCount(editor.getText().length);
      }

      // Update selected module based on ModuleType
      const module = modules.find(
        (m) => m.label === templateData?.data[0].ModuleType
      );
      // if (module) {
      //   setSelectedModule(module.label);
      // }
    }
  }, [templateData, editor]);

  // Function to scan content and update selectedParamIds
  const updateSelectedParamIds = (editorText, subjectText) => {
    if (!paramsData?.data) return;

    // Combine editor and subject text to find all parameters
    const combinedText = `${editorText} ${subjectText}`;
    // Match all {{ParamName}} patterns
    const paramMatches = combinedText.match(/{{[^{}]+}}/g) || [];
    // Extract param names (remove {{}})
    const paramNames = paramMatches.map((param) => param.slice(2, -2));

    // Map param names to IDs
    const newParamIds = paramNames
      .map((name) => {
        const param = paramsData.data.find((p) => p.ParamName === name);
        return param ? param.Id : null;
      })
      .filter((id) => id !== null);

    // Update selectedParamIds (only unique IDs)
    setSelectedParamIds([...new Set(newParamIds)]);
  };

  const handleParamClick = (item) => {
    const paramText = `{{${item.ParamName}}}`;
    if (activeField === "subject") {
      if ((subject + paramText).length <= 255) {
        setSubject((prev) => {
          const newSubject = prev + paramText;
          updateSelectedParamIds(editor?.getText() || "", newSubject);
          return newSubject;
        });
        setTimeout(() => {
          subjectInputRef.current?.focus();
        }, 0);
      }
    } else {
      const currentText = editor?.getText() || "";
      if ((currentText + paramText).length <= 1000) {
        editor?.chain().focus().insertContent(paramText).run();
        // updateSelectedParamIds called in onUpdate
      }
    }
  };

  const handleSave = async () => {
    const editorText = editor?.getText() || "";
    if (subject.length > 255) {
      alert("Subject line cannot exceed 255 characters.");
      return;
    }
    if (editorText.length > 1000) {
      alert("Email content cannot exceed 1000 characters.");
      return;
    }
    try {
      const payload = {
        CompanyID: parseInt(hasMultipleLocations[0]),
        ModuleType: selectedModule,
        ParamIDs: selectedParamIds,
        WATemplate: editor.getHTML(),
        Status: 1,
        IsActive: 1,
        WAAttachment: includeAttachment,
        EmailTemplate :templateData?.data[0]?.EmailTemplate,
        EmailSubject:templateData?.data[0]?.EmailSubject,
        EmailAttachment:templateData?.data[0]?.EmailAttachment
      };
     
      if (templateData?.data[0]?.CompanyID) {
        await updateEmail({ payload }).unwrap();
        toast.success("Whatsapp successfully updated!");
      } else {
        await createEmail(payload).unwrap();
        toast.success("Whatsapp successfully created!");
      }
    } catch (error) {
      console.error("Error saving Whatsapp template:", error);
    }
  };

  const subjectCharCount = subject.length;

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-8xl tiptap">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 p-6">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Whatsapp Templates
              </h1>
              <p className="text-gray-600 mt-2">
                Create and manage professional whatsapp templates for different
                modules
              </p>
            </div>
          </div>
        </div>

        {/* Module Tabs */}
        <div className="px-8 py-6 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {modules.map((item) => (
              <button
                key={item.label}
                className={`
                  px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200
                  border-2
                  ${
                    selectedModule === item.label
                      ? "bg-neutral-800 text-white border-neutral-800 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }
                `}
                onClick={() => setSelectedModule(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Container */}
        <div className="py-5">
          {/* Toolbar */}
          <div className="border border-gray-300 rounded-t-lg bg-white">
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-300">
              {/* Text Formatting */}
              <div className="flex items-center border-r border-gray-200 pr-3 mr-3">
                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("bold")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("italic")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("underline")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Underline"
                >
                  <UnderlineIcon size={18} />
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center border-r border-gray-200 pr-3 mr-3">
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive({ textAlign: "left" })
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive({ textAlign: "center" })
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive({ textAlign: "right" })
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Align Right"
                >
                  <AlignRight size={18} />
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center border-r border-gray-200 pr-3 mr-3">
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("bulletList")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Bullet List"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("orderedList")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Numbered List"
                >
                  <ListOrdered size={18} />
                </button>
              </div>

              {/* Headings & Blocks */}
              <div className="flex items-center border-r border-gray-200 pr-3 mr-3">
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "paragraph") {
                      editor.chain().focus().setParagraph().run();
                    } else {
                      editor
                        .chain()
                        .focus()
                        .toggleHeading({ level: parseInt(value) })
                        .run();
                    }
                  }}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="paragraph">Paragraph</option>
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                </select>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className={`p-2 rounded hover:bg-gray-100 ${
                    editor.isActive("blockquote")
                      ? "bg-gray-200 text-blue-600"
                      : "text-gray-700"
                  }`}
                  title="Quote"
                >
                  <Quote size={18} />
                </button>
              </div>

              {/* History */}
              <div className="flex items-center">
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-2 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <Undo size={18} />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-2 rounded hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <Redo size={18} />
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="border border-gray-300 border-t-0 rounded-b-lg">
              <EditorContent editor={editor} />
            </div>
          </div>
          <div
            className={`text-sm mt-1 ${
              editorCharCount >= 1000 ? "text-red-600" : "text-gray-600"
            }`}
            aria-live="polite"
          >
            {editorCharCount} / 1000 characters
          </div>
          <div className="mt-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={includeAttachment}
                onChange={(e) => setIncludeAttachment(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              Attachment
            </label>
          </div>
          {/* Parameters */}
          <div className="flex gap-3 items-center flex-wrap mt-5">
            {isParamsLoading ? (
              <div>Loading parameters...</div>
            ) : (
              paramsData?.data.map((item) => (
                <div
                  key={item.Id}
                  className="bg-[#1976d2]/80 py-2 px-4 text-neutral-50 rounded-lg cursor-pointer hover:bg-[#1976d2]/70"
                  onClick={() => handleParamClick(item)}
                >
                  {item.ParamName}
                </div>
              ))
            )}
          </div>

          {/* Save Button */}
          <div className="mt-5 flex justify-end">
            <Button
              className="w-50"
              onClick={handleSave}
              isLoading={isUpdating || isEmailCreating}
              disabled={
                isEmailCreating ||
                subjectCharCount > 255 ||
                editorCharCount > 1000
              }
            >
              {templateData?.data[0]?.CompanyID ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappTemplates;
