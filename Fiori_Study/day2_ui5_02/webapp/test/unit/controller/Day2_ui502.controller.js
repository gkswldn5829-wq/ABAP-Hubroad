/*global QUnit*/

sap.ui.define([
	"codecl3/day2ui502/controller/Day2_ui502.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day2_ui502 Controller");

	QUnit.test("I should test the Day2_ui502 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
