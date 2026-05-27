/*global QUnit*/

sap.ui.define([
	"zcl327/ztest01/controller/ztest_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ztest_01 Controller");

	QUnit.test("I should test the ztest_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
