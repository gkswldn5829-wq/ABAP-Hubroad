/*global QUnit*/

sap.ui.define([
	"code/cl3/day9ui501/controller/day9_ui5_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("day9_ui5_01 Controller");

	QUnit.test("I should test the day9_ui5_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
