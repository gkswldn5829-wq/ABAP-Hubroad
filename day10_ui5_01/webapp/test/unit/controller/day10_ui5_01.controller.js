/*global QUnit*/

sap.ui.define([
	"code/cl3/day10ui501/controller/day10_ui5_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("day10_ui5_01 Controller");

	QUnit.test("I should test the day10_ui5_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
