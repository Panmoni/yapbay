import re


def escape_content(match):
    content = match.group(1)
    content = content.replace("'", '&#x27;').replace('"', '&quot;')
    return content


def markdown_to_html(markdown):
    # Convert markdown headers to HTML
    html_content = re.sub(
        r'^# (.*)$', r'<h1 className="text-4xl font-bold mt-4 mb-1">\1</h1>', markdown, flags=re.MULTILINE)
    html_content = re.sub(
        r'^## (.*)$', r'<h2 className="text-2xl font-bold mt-4 mb-1">\1</h2>', html_content, flags=re.MULTILINE)
    html_content = re.sub(
        r'^### (.*)$', r'<h3 className="text-xl font-bold mt-4 mb-1">\1</h3>', html_content, flags=re.MULTILINE)

    # Convert markdown list items to HTML
    html_content = re.sub(r'^\- (.*)$', r'<li>\1</li>',
                          html_content, flags=re.MULTILINE)

    # Wrap consecutive list items with <ul> tags
    html_content = re.sub(r'(<li>.*?</li>)', r'\1',
                          html_content, flags=re.DOTALL)
    html_content = re.sub(r'(?:<li>.*?</li>\s*)+',
                          r'<ul className="list-disc pl-5">\g<0></ul>', html_content, flags=re.DOTALL)

    # Convert markdown links to HTML
    html_content = re.sub(
        r'\[(.*?)\]\((.*?)\)', r'<a href="\2" className="text-blue-500">\1</a>', html_content)

    # Convert markdown paragraphs to HTML
    html_content = re.sub(
        r'^(?!<[hlu]|<a)(.*)', r'<p className="mt-4 mb-1">\1</p>', html_content, flags=re.MULTILINE)

    # Remove empty <p> tags
    html_content = re.sub(
        r'<p className="mt-4 mb-1">\s*</p>', '', html_content)

    # Remove <p> tags enclosing <h> and <ul> tags
    html_content = re.sub(
        r'<p className="mt-4 mb-1">(<[hu].*</[hu]>)</p>', r'\1', html_content, flags=re.DOTALL)

    # Remove extra </ul> tags
    html_content = re.sub(
        r'</ul>\s*<ul className="list-disc pl-5">', '', html_content)

    # Remove </ul> tags before <h> tags
    html_content = re.sub(r'</ul>\s*(<h\d)', r'\1', html_content)

    # Escape necessary characters within the content
    html_content = re.sub(r'>(.*?)<', escape_content, html_content)

    return html_content


# Read the markdown file
with open('ROADMAP.md', 'r') as file:
    markdown = file.read()

# Convert markdown to HTML
html_content = markdown_to_html(markdown)

# Generate the complete HTML document
html_output = f'''
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YapBay Roadmap</title>
</head>
<body>
  <main>
    <div className="my-12 space-y-8 max-w-2xl mx-auto">
      {html_content}
    </div>
  </main>
</body>
</html>
'''

# Write the HTML to a file
with open('roadmap.html', 'w') as file:
    file.write(html_output)
