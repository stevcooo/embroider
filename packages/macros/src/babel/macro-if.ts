import { NodePath } from '@babel/traverse';
import State from './state';
import evaluateJSON from './evaluate-json';
import { callExpression, CallExpression } from '@babel/types';
import error from './error';
import { PackageCache } from '@embroider/core';

export default function macroIf(path: NodePath<CallExpression>, state: State, packageCache: PackageCache) {
  let args = path.get('arguments');
  if (args.length !== 2 && args.length !== 3) {
    throw error(path, `macroIf takes two or three arguments, you passed ${args.length}`);
  }

  let [predicatePath, consequent, alternate] = args;
  let predicate = evaluate(predicatePath, state, packageCache);
  if (!predicate.confident) {
    throw error(args[0], `the first argument to macroIf must be statically known`);
  }

  if (!consequent.isArrowFunctionExpression()) {
    throw error(args[1], `The second argument to macroIf must be an arrow function expression.`);
  }

  if (alternate && !alternate.isArrowFunctionExpression()) {
    throw error(args[2], `The third argument to macroIf must be an arrow function expression.`);
  }

  state.removed.push(path.get('callee'));
  let [kept, dropped] = predicate.value ? [consequent, alternate] : [ alternate, consequent];
  if (kept) {
    let body = kept.get('body');
    if (body.type === 'BlockStatement') {
      path.replaceWith(callExpression(kept.node, []));
    } else {
      path.replaceWith(body);
    }
  } else {
    path.remove();
  }

  if (dropped) {
    state.removed.push(dropped);
  }
}

function evaluate(path: NodePath, state: State, packageCache: PackageCache): { confident: boolean, value: any } {
  let builtIn = path.evaluate();
  if (builtIn.confident) {
    return builtIn;
  }

  // we can go further than babel's evaluate() because we know that we're
  // typically used on JSON, not full Javascript.
  return evaluateJSON(path, state, packageCache);
}
