import { useCallback, useState } from 'react';
import styles from './CopyButton.module.css';

type CopyButtonProps = {
  value: string;
  label?: string;
};

export function CopyButton({ value, label = 'Copy address' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <button
      type="button"
      className={copied ? styles.buttonCopied : styles.button}
      onClick={() => void handleCopy()}
      aria-live="polite"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
