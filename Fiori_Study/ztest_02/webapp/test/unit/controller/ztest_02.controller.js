/*global QUnit*/

sap.ui.define([
	"zcl327/ztest02/controller/ztest_02.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ztest_02 Controller");

	QUnit.test("I should test the ztest_02 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
