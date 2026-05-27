/*global QUnit*/

sap.ui.define([
	"codecl3/day7ui502/controller/day7_ui5_02.controller"
], function (Controller) {
	"use strict";

	QUnit.module("day7_ui5_02 Controller");

	QUnit.test("I should test the day7_ui5_02 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
