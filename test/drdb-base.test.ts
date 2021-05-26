import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as DrdbBase from '../lib/drdb-base-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new DrdbBase.DrdbBaseStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
