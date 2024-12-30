import { intersectionObserver } from "./utils/observer.ts";

// Define types and interfaces
interface VirtualListProps<T> {
  getPage: (p: number) => Promise<T[]>;
  getTemplate: (datum: T, element?: null) => HTMLElement;
  updateTemplate: (datum: T, element: HTMLElement) => HTMLElement;
  pageSize: number;
}

/**
 * Standard Margin between cards
 * @type {number}
 */
const MARGIN = 16;

/**
 * Returns top and bottom observer elements
 * @returns {[HTMLElement | null, HTMLElement | null]}
 */
const getObservers = (): [HTMLElement, HTMLElement] => [
  document.getElementById("top-observer")!,
  document.getElementById("bottom-observer")!,
];

/**
 * Returns a virtual list container
 * @returns {HTMLElement | null}
 */
function getVirtualList(): HTMLElement | null {
  return document.getElementById("virtual-list");
}

/**
 * Returns a main app container
 * @returns {HTMLElement | null}
 */
function getContainer(): HTMLElement | null {
  return document.getElementById("container");
}

/**
 * Returns `data-y` attribute of the HTMLElement, if value is provided
 * additionally updates the attribute
 *
 * @param element {HTMLElement}
 * @param value {string | number | undefined}
 * @returns {number | null}
 */
function y(
  element: HTMLElement,
  value: string | number | undefined = undefined
): number | null {
  if (value != null) {
    element?.setAttribute("data-y", value.toString());
  }
  const yValue = element?.getAttribute("data-y");
  if (yValue !== "" && yValue != null && +yValue === +yValue) {
    return +yValue;
  }
  return null;
}

/**
 * Returns a CSS Transform Style string to Move Element by certain amount of pixels
 * @param value - value in pixels
 * @returns {string}
 */
function translateY(value: number): string {
  return `translateY(${value}px)`;
}

/**
 * VirtualList Class
 */
export class VirtualList<T> {
  private props: VirtualListProps<T>;
  private root: HTMLElement;
  private start: number;
  private end: number;

  /**
   * @param root - Root element where the virtual list will be mounted
   * @param props - Configuration props for the virtual list
   */
  constructor(root: HTMLElement, props: VirtualListProps<T>) {
    this.props = { ...props };
    this.root = root;
    this.start = 0;
    this.end = 0;
  }

  /**
   * Returns an HTML Representation of the component, should have the following structure:
   * #container>
   *    #top-observer+
   *    #virtual-list+
   *    #bottom-observer
   * @returns {string}
   */
  toHTML(): string {
    /**
     * Part 1 - App Skeleton
     * @todo
     */
    return `<div id="container">
        <div id="top-observer">Top Observer</div>
        <div id="virtual-list"></div>
        <div id="bottom-observer">Bottom Observer</div>
      </div>`.trim();
  }

  /**
   * Private effect method
   */
  #effect(): void {
    intersectionObserver(
      getObservers(),
      (entries) => this.#handleIntersectionObserver(entries),
      {
        threshold: 0.2,
      }
    );
  }

  /**
   * Render method
   */
  render(): void {
    this.root.innerHTML = this.toHTML();
    this.#effect();
  }

  /**
   * Handles observer intersection entries
   * @param entries - Array of intersection observer entries
   */
  #handleIntersectionObserver(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (entry.target.id === "top-observer") {
          this.#handleTopObserver();
        } else if (entry.target.id === "bottom-observer") {
          this.#handleBottomObserver();
        }
      }
    }
  }

  /**
   * Handle bottom observer intersection
   */
  async #handleBottomObserver(): Promise<void> {
    const data = await this.props.getPage(this.end++);
    const list = getVirtualList();
    const fragment = new DocumentFragment();

    for (const datum of data) {
      const card = this.props.getTemplate(datum, null);
      fragment.appendChild(card);
    }
    list?.appendChild(fragment);
  }

  /**
   * Handle top observer intersection
   */
  async #handleTopObserver(): Promise<void> {}

  /**
   * Function uses `props.getTemplate` to update the html elements
   * using provided data
   *
   * @param elements - HTML Elements to update
   * @param data - Data to use for update
   */
  #updateData(elements: HTMLElement[], data: T[]): void {}

  /**
   * Move elements on the screen using CSS Transform
   *
   * @param direction - Direction to move elements
   */
  #updateElementsPosition(direction: "top" | "down"): void {
    const [top, bottom] = getObservers();
    if (direction === "down") {
      // To implement
    } else if (direction === "top") {
      // To implement
    }
  }
}
