/*global QUnit*/

sap.ui.define([
	"code/cl3/day7ui501/controller/Day7_ui5_01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day7_ui5_01 Controller");

	QUnit.test("I should test the Day7_ui5_01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
