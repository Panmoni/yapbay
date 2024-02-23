import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Contact() {
  return (
    <main>
      <Container>
        <PageTitle title="App" description="In Development." />
        <p className="my-4">
          YapBay is under active development.{" "}
          <a href="https://twitter.com/yapbay_" target="_blank">
            Follow @YapBay_ on X
          </a>{" "}
          for updates!
        </p>
      </Container>
    </main>
  );
}
