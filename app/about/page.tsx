import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Link from "next/link";

export default function Roadmap() {
  return (
    <main>
      <Container>
        <PageTitle title="About" description="Borne of years of research." />
        <p className="my-4">
          YapBay is a mission-oriented project that aims to knock down the walls
          that separate people financially across the globe.
        </p>
        <p className="my-4">
          Those walls separate people from each other, and from prosperity.
        </p>
        <p className="my-4">That&apos;s not ok.</p>
        <h2 className="text-3xl font-bold mb-4">Team</h2>
        Currently the team is{" "}
        <Link href="https://georgedonnelly.com/portfolio/">
          George Donnelly
        </Link>
        , who has been working on crypto mass adoption since 2018. Visit
        <Link href="https://georgedonnelly.com/portfolio/">
          GeorgeDonnelly.com
        </Link>{" "}
        for more information.
      </Container>
    </main>
  );
}
