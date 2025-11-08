export default function SectionHeader({ title, className = "" }) {
  return (
    <div className={`container dark-green-bg p-3 mb-4 ${className}`}>
      <h4 className="text-white m-0">{title}</h4>
    </div>
  );
}
