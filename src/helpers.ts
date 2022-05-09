const applyCSS = (element: HTMLElement, styles: Record<string, unknown>) => {
  for (const property of Object.keys(styles)) {
    element.style[property] = styles[property];
  }
};

export const createElement = (
  tagName: string,
  { id, className, styles }: { id?: string; className?: string; styles?: Record<string, unknown> }
): HTMLElement => {
  const element = document.createElement(tagName);
  if (id) element.id = id;
  if (className) element.className = className;
  if (styles) applyCSS(element, styles);
  return element;
};
