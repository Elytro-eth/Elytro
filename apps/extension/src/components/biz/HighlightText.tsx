interface HighlightTextProps {
  text: string;
  highlight: string;
  highlightClassName?: string;
  className?: string;
}

export const HighlightText = ({
  text,
  highlight,
  highlightClassName = 'font-bold',
  className = '',
}: HighlightTextProps) => {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={index} className={highlightClassName}>
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};
