type InputComponentProps = {
  type: "email" | "password" | "text";
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export default function InputComponent({
  type,
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
}: InputComponentProps) {
  // Gerar um ID único baseado no label
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="w-full flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-amber-50 font-medium text-xs md:text-sm text-start"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-12 md:h-16 bg-amber-50 rounded-md px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-100 text-emerald-900 placeholder:text-emerald-700/50 transition-all ${
          error
            ? "border-2 border-red-500 bg-red-50 focus:ring-1 focus:ring-red-500"
            : ""
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {error && (
        <p className="text-red-400 text-xs md:text-sm font-medium">{error}</p>
      )}
    </div>
  );
}
