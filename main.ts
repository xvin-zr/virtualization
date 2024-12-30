import { VirtualList } from "./virtual-list.ts";
import { initMockDB } from "./utils/db.js";
const container = document.body;
const template = document.getElementById(
  "card_template"
) as HTMLTemplateElement;
const DB = initMockDB({
  title: "Frontend System Design",
  body: "Learning about virtualization",
});

/**
 * @param datum {{ title: string, body: string}}
 * @param element {HTMLElement | null | undefined}
 * @returns {HTMLElement}
 */
function createOrUpdateCard(
  datum: { title: string; body: string },
  element: HTMLElement | null | undefined
): HTMLElement {
  const card =
    element ??
    ((template.content.cloneNode(true) as HTMLElement)
      .firstElementChild as HTMLDivElement);
  console.log(card);

  const [cardTitle, cardBody] = card.querySelectorAll(
    ".card__title, .card__body__content"
  );
  cardTitle.textContent = datum.title;
  cardBody.textContent = datum.body;
  return card;
}

const list = new VirtualList(container, {
  getPage: (p) => DB.getPage(p),
  getTemplate: createOrUpdateCard,
  pageSize: 10,
  updateTemplate: createOrUpdateCard,
});
list.render();
