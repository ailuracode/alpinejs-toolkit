const GENERATED_IDS = new WeakMap<object, number>();

let counter = 0;

export const generateControllerId = (controller: object): string => {
  let id = GENERATED_IDS.get(controller);

  if (id === undefined) {
    counter += 1;
    id = counter;
    GENERATED_IDS.set(controller, id);
  }

  return `controller-${id.toString(36)}`;
};
