/*global QUnit*/

sap.ui.define([
	"code/cl3/day1ui501/controller/Day1View01.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day1View01 Controller");

	QUnit.test("I should test the Day1View01 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
