import Link from "next/link";

export default function Brand({ sub = "Chapter 4 troubleshooting adventure", href = "/" }) {
  return (
    <Link className="brand" href={href}>
      <span className="brand-mark" aria-hidden="true">FF</span>
      <span>
        <strong>Fault Finders</strong>
        <small>{sub}</small>
      </span>
    </Link>
  );
}
