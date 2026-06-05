type FlexibleIntegerInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  id?: string;
};

/** Entero editable: permite vaciar el campo y escribir otro número sin forzar un mínimo al tipear. */
export default function FlexibleIntegerInput({
  value,
  onChange,
  className = 'input-field',
  placeholder = '1',
  id,
}: FlexibleIntegerInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      value={value > 0 ? String(value) : ''}
      placeholder={placeholder}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits === '' ? 0 : parseInt(digits, 10));
      }}
      className={className}
    />
  );
}
