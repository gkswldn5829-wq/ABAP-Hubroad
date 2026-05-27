/*global QUnit*/

sap.ui.define([
	"code/cl3/day9ui502/controller/day9_ui5_02.controller"
], function (Controller) {
	"use strict";

	QUnit.module("day9_ui5_02 Controller");

	QUnit.test("I should test the day9_ui5_02 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
