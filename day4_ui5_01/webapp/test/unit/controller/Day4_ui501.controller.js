/*global QUnit*/

sap.ui.define([
	"codecl3/day4ui501/controller/Day4_ui501.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Day4_ui501 Controller");

	QUnit.test("I should test the Day4_ui501 controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
