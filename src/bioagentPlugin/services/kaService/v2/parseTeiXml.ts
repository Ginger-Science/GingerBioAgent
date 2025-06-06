import libxmljs from "libxmljs";

const ns = { tei: "http://www.tei-c.org/ns/1.0" };

function findAndExtractSectionContent(
  // @ts-ignore
  doc: libxmljs.Document,
  sectionNameLC: string,
  namespaces: object
) {
  let sectionDiv = null;

  // XPath to find by type attribute (preferred if available)
  const xpathType = `//tei:body//tei:div[@type='${sectionNameLC}']`;
  sectionDiv = doc.get(xpathType, namespaces);

  // If not found by type, try finding by <head> content (case-insensitive)
  if (!sectionDiv) {
    const xpathHead = `//tei:body//tei:div[translate(tei:head, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') = '${sectionNameLC}']`;
    sectionDiv = doc.get(xpathHead, namespaces);
  }

  // If a div was found by either method, extract its content excluding the head
  if (sectionDiv) {
    // Find all direct child elements (*) of the sectionDiv that are NOT the <head> element
    const contentNodes = sectionDiv.find(
      "./tei:*[not(self::tei:head)]",
      namespaces
    );

    if (contentNodes && contentNodes.length > 0) {
      // Map each content node (like <p>, <formula>) to its trimmed text content
      // Join the text content of these nodes, separating them for readability (e.g., paragraphs)
      return contentNodes.map((node) => node.text().trim()).join("\n\n");
    } else {
      // Div was found but contained only a head or was empty otherwise.
      return ""; // Return empty string rather than null if the section div exists but is empty.
    }
  }

  // If no div was found by either method
  return null;
}

/**
 * Helper function for simpler extractions (like DOI, Abstract in header, listBibl).
 * Extracts the text content of the first matching node.
 * @param {libxmljs.Document} doc - The parsed libxmljs document.
 * @param {string} xpath - The XPath query string.
 * @param {object} namespaces - The namespace object for the query.
 * @returns {string | null} The trimmed text content of the found node, or null if not found.
 */
function extractTextSimple(
  // @ts-ignore
  doc: libxmljs.Document,
  xpath: string,
  namespaces: object
) {
  const node = doc.get(xpath, namespaces);
  return node ? node.text().trim() : null;
}

export async function parseXml(teiXml: string) {
  try {
    const doc = libxmljs.parseXml(teiXml);

    // 1. Extract DOI (using simple helper)
    const doi =
      extractTextSimple(
        doc,
        '/tei:TEI/tei:teiHeader/tei:fileDesc/tei:sourceDesc/tei:biblStruct/tei:idno[@type="DOI"]',
        ns
      ) ||
      extractTextSimple(
        // Fallback if @type="DOI" is missing
        doc,
        "/tei:TEI/tei:teiHeader/tei:fileDesc/tei:sourceDesc/tei:biblStruct/tei:idno",
        ns
      );

    // 2. Extract Abstract (using simple helper - common location)
    const abstract = extractTextSimple(
      doc,
      "/tei:TEI/tei:teiHeader/tei:profileDesc/tei:abstract",
      ns
    );

    // 3. Extract Citations (using simple helper - common location)
    const citations = extractTextSimple(doc, "//tei:back//tei:listBibl", ns);

    // 4. Extract Body Sections (using the robust helper)
    const introduction = findAndExtractSectionContent(doc, "introduction", ns);
    const methods = findAndExtractSectionContent(doc, "methods", ns);
    const results = findAndExtractSectionContent(doc, "results", ns); // This will handle your example
    const discussion = findAndExtractSectionContent(doc, "discussion", ns);

    // Return the structured object
    return {
      doi,
      abstract,
      introduction,
      methods,
      results,
      discussion,
      citations,
    };
  } catch (error) {
    console.error("Failed to parse XML or extract sections:", error);
    // Return an object indicating failure
    return {
      doi: null,
      abstract: null,
      introduction: null,
      methods: null,
      results: null,
      discussion: null,
      citations: null,
      error: `Parsing failed: ${error.message}`,
    };
  }
}
