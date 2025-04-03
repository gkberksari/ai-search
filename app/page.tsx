import Link from "next/link";

export default function Home() {
  return (
    <div className=" font-[family-name:var(--font-geist-sans)]">
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <h2 className="text-3xl font-semibold">
          Welcome to the Company Applicant List App
          <br />
          <br />
          App take place on{" "}
          <Link className="underline text-blue-500" href={"/talent-pool"}>
            Talent Pool
          </Link>
        </h2>
      </main>
    </div>
  );
}
