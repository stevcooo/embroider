import { module, test } from 'qunit';
import { visit } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import ENV from 'dummy/config/environment';
import { getGlobalConfig } from '@embroider/macros';

/* global requirejs */

module('Acceptance | lazy routes', function (hooks) {
  setupApplicationTest(hooks);

  function hasController(routeName) {
    return Boolean(
      requirejs.entries[`${ENV.modulePrefix}/controllers/${routeName}`]
    );
  }

  function hasRoute(routeName) {
    return Boolean(
      requirejs.entries[`${ENV.modulePrefix}/routes/${routeName}`]
    );
  }

  function hasTemplate(routeName) {
    return Boolean(
      requirejs.entries[`${ENV.modulePrefix}/templates/${routeName}`]
    );
  }

  function hasComponent(name) {
    return Boolean(requirejs.entries[`${ENV.modulePrefix}/components/${name}`]);
  }

  if (ENV.isClassic) {
    test('lazy routes present', async function (assert) {
      await visit('/');
      assert.ok(hasController('split-me'), 'classic build has controller');
      assert.ok(hasRoute('split-me'), 'classic build has route');
      assert.ok(hasTemplate('split-me'), 'classic build has template');
      assert.ok(
        hasController('split-me/child'),
        'classic build has child controller'
      );
      assert.ok(hasRoute('split-me/child'), 'classic build has child route');
      assert.ok(
        hasTemplate('split-me/child'),
        'classic build has child template'
      );
      assert.ok(
        hasComponent('used-in-child'),
        'classic build has all components'
      );
    });
  } else {
    test('lazy routes not yet present', async function (assert) {
      await visit('/');
      assert.notOk(hasController('split-me'), 'controller is lazy');
      assert.notOk(hasRoute('split-me'), 'route is lazy');
      assert.notOk(hasTemplate('split-me'), 'template is lazy');
      assert.notOk(hasController('split-me/child'), 'child controller is lazy');
      assert.notOk(hasRoute('split-me/child'), 'child route is lazy');
      assert.notOk(hasTemplate('split-me/child'), 'child template is lazy');
      assert.notOk(
        hasComponent('used-in-child'),
        'descendant components are lazy'
      );
    });
  }

  if (ENV.isClassic) {
    test('classic builds can not see @embroider/core config', async function (assert) {
      let config = getGlobalConfig()['@embroider/core'];
      assert.strictEqual(
        config,
        undefined,
        'expected no embroider core config'
      );
    });
  } else {
    test('can see @embroider/core config', async function (assert) {
      let config = getGlobalConfig()['@embroider/core'];
      assert.true(config.active, 'expected to see active @embroider/core');
    });
  }

  test('can enter a lazy route', async function (assert) {
    await visit('/split-me');
    assert.ok(
      document.querySelector('[data-test-split-me-index]'),
      'split-me/index rendered'
    );
  });

  test('can enter a child of a lazy route', async function (assert) {
    await visit('/split-me/child');
    assert.ok(
      document.querySelector('[data-test-used-in-child]'),
      'split-me/child rendered'
    );
  });
});
