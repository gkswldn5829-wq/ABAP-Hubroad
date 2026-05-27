/*global QUnit*/

sap.ui.define([
	"codecl3/day5ui01/controller/Day5_UI501.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day5_UI501 Controller");

	QUnit.test("I should test the Day5_UI501 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
