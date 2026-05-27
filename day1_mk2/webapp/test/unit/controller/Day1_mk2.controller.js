/*global QUnit*/

sap.ui.define([
	"academycl3/day1mk2/controller/Day1_mk2.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day1_mk2 Controller");

	QUnit.test("I should test the Day1_mk2 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
