import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Contact() {
  return (
    <main>
      <Container>
        <PageTitle title="Contact" />
        <div className="max-w-2xl mx-auto mb-10">
          <p className="my-4">
            Please email <a href="mailto:hello@yapbay.com">hello@yapbay.com</a>{" "}
            or reach out to{" "}
            <a href="https://t.me/GeorgeDonnelly" target="_blank">
              George Donnelly on Telegram
            </a>
            .
          </p>
        </div>
      </Container>
    </main>
  );
}
