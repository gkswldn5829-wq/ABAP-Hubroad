/*global QUnit*/

sap.ui.define([
	"codecl3/day3ui501/controller/Day3UI501.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day3UI501 Controller");

	QUnit.test("I should test the Day3UI501 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
