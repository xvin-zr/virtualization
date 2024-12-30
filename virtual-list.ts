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
  element: HTMLElement | undefined,
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
  private limit: number;
  private pool: HTMLElement[];

  /**
   * @param root - Root element where the virtual list will be mounted
   * @param props - Configuration props for the virtual list
   */
  constructor(root: HTMLElement, props: VirtualListProps<T>) {
    this.props = { ...props };
    this.root = root;
    this.start = 0;
    this.end = 0;
    this.limit = props.pageSize * 2;
    this.pool = [];
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
        if (entry.target.id === "top-observer" && this.start > 0) {
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
    const container = getContainer()!;

    if (this.pool.length < this.limit) {
      const list = getVirtualList();
      const fragment = new DocumentFragment();

      for (const datum of data) {
        const card = this.props.getTemplate(datum, null);
        fragment.appendChild(card);
        this.pool.push(card);
      }
      list?.appendChild(fragment);
    } else {
      const [toRecycle, unchanged] = [
        this.pool.slice(0, this.props.pageSize),
        this.pool.slice(this.props.pageSize),
      ];
      this.pool = unchanged.concat(toRecycle);
      this.#updateData(toRecycle, data);
      this.start++;
    }
    this.#updateElementsPosition("down");
    container.style.height = `${container?.scrollHeight}px`;
  }

  /**
   * Handle top observer intersection
   */
  async #handleTopObserver(): Promise<void> {
    this.start--;
    this.end--;
    const data = await this.props.getPage(this.start);
    const [unchanged, toRecycle] = [
      this.pool.slice(0, this.props.pageSize),
      this.pool.slice(this.props.pageSize),
    ];
    this.pool = toRecycle.concat(unchanged);
    this.#updateData(toRecycle, data);
    this.#updateElementsPosition("top");
  }

  /**
   * Function uses `props.getTemplate` to update the html elements
   * using provided data
   *
   * @param elements - HTML Elements to update
   * @param data - Data to use for update
   */
  #updateData(elements: HTMLElement[], data: T[]): void {
    for (let i = 0; i < data.length; i++) {
      this.props.updateTemplate(data[i], elements[i]);
    }
  }

  /**
   * Move elements on the screen using CSS Transform
   *
   * @param direction - Direction to move elements
   */
  #updateElementsPosition(direction: "top" | "down"): void {
    const [top, bottom] = getObservers();
    if (direction === "down") {
      for (let i = 0; i < this.pool.length; i++) {
        const [prev, curr] = [this.pool.at(i - 1), this.pool[i]];
        if (y(prev) === null) {
          y(curr, 0);
        } else {
          const newY =
            y(prev)! + MARGIN * 2 + prev!.getBoundingClientRect().height;
          y(curr, newY);
          curr.style.transform = translateY(newY);
        }
      }
    } else if (direction === "top") {
      for (let i = this.props.pageSize - 1; i >= 0; i--) {
        const [curr, next] = [this.pool[i], this.pool[i + 1]];
        const newY =
          y(next)! - MARGIN * 2 - curr.getBoundingClientRect().height;
        y(curr, newY);
        curr.style.transform = translateY(newY);
      }
    }

    const [first, last] = [this.pool[0], this.pool.at(-1)!];
    const topY = y(first)!;
    const bottomY = y(last)! + MARGIN * 2 + last.getBoundingClientRect().height;

    top.style.transform = translateY(topY);
    bottom.style.transform = translateY(bottomY);
  }
}
