/*global QUnit*/

sap.ui.define([
	"code/cl3/examam/controller/exam_am.controller"
], function (Controller) {
	"use strict";

	QUnit.module("exam_am Controller");

	QUnit.test("I should test the exam_am controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
