(()=>{

window.stopSimulatingGestures && window.stopSimulatingGestures();
window.simulatingGestures = false;

let gestureTimeoutID;
let periodicGesturesTimeoutID;

let choose = (array)=> array[~~(Math.random() * array.length)];
let isAnyMenuOpen = ()=> $(".menu-button.active").length > 0;

window.simulateRandomGesture = (callback, {shift, shiftToggleChance=0.01, secondary, secondaryToggleChance, target}) => {
	let rect;
	if (target) {
		rect = target.getBoundingClientRect();
	} else {
		target = canvas;
		rect = document.body.getBoundingClientRect();
	}

	let triggerMouseEvent = (type, point) => {
		
		if (isAnyMenuOpen()) {
			return;
		}

		// target = document.elementFromPoint(point.x, point.y);
		var el_over = document.elementFromPoint(point.x, point.y);
		if (!type.match(/move/) && (!el_over || !el_over.closest(".canvas-area"))) {
			return;
		}

		let event = new $.Event(type, {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: rect.left + point.x,
			clientY: rect.top + point.y,
			screenX: rect.left + point.x,
			screenY: rect.top + point.y,
			offsetX: point.x,
			offsetY: point.y,
			button: secondary ? 2 : 0,
			buttons: secondary ? 2 : 1,
			shiftKey: shift,
		});
		$(target).trigger(event);
	};

	let t = 0;
	let cx = Math.random() * rect.width;
	let cy = Math.random() * rect.height;
	let gestureComponents = [];
	let numberOfComponents = 5;
	for (let i = 0; i < numberOfComponents; i += 1) {
		gestureComponents.push({
			rx:
				(Math.random() * Math.min(rect.width, rect.height)) /
				2 /
				numberOfComponents,
			ry:
				(Math.random() * Math.min(rect.width, rect.height)) /
				2 /
				numberOfComponents,
			angularFactor: Math.random() * 5 - Math.random(),
			angularOffset: Math.random() * 5 - Math.random(),
		});
	}
	let pointForTime = (t) => {
		let point = { x: cx, y: cy };
		for (let i = 0; i < gestureComponents.length; i += 1) {
			let { rx, ry, angularFactor, angularOffset } = gestureComponents[i];
			point.x +=
				Math.sin(Math.PI * 2 * ((t / 100) * angularFactor + angularOffset)) *
				rx;
			point.y +=
				Math.cos(Math.PI * 2 * ((t / 100) * angularFactor + angularOffset)) *
				ry;
		}
		return point;
	};
	triggerMouseEvent("pointerdown", pointForTime(t));
	let move = () => {
		t += 1;
		if (Math.random() < shiftToggleChance) {
			shift = !shift;
		}
		if (Math.random() < secondaryToggleChance) {
			secondary = !secondary;
		}
		if (t > 50) {
			triggerMouseEvent("pointerup", pointForTime(t));
			if (callback) {
				callback();
			}
		} else {
			triggerMouseEvent("pointermove", pointForTime(t));
			gestureTimeoutID = setTimeout(move, 10);
		}
	};
	move();
};

window.simulateRandomGesturesPeriodically = () => {
	window.simulatingGestures = true;

	let delayBetweenGestures = 500;
	let shiftStart = false;
	let shiftStartToggleChance = 0.1;
	let shiftToggleChance = 0.001;
	let secondaryStart = false;
	let secondaryStartToggleChance = 0.1;
	let secondaryToggleChance = 0.001;
	let switchToolsChance = 0.5;
	let multiToolsChance = 0.0;
	let pickColorChance = 0.5;
	let pickToolOptionsChance = 0.8;
	let scrollChance = 0.2;
	let dragSelectionChance = 0.8;
	
	let _simulateRandomGesture = (callback)=> {
		window.simulateRandomGesture(callback, {
			shift: shiftStart,
			shiftToggleChance,
			secondary: secondaryStart,
			secondaryToggleChance
		});
	};
	let waitThenGo = () => {
		// TODO: a button to stop it as well (maybe make "stop drawing randomly" a link button?)
		$status_text.text("Press Esc to stop drawing randomly.");
		if (isAnyMenuOpen()) {
			setTimeout(waitThenGo, 50);
			return;
		}

		if (Math.random() < shiftStartToggleChance) {
			shiftStart = !shiftStart;
		}
		if (Math.random() < secondaryStartToggleChance) {
			secondaryStart = !secondaryStart;
		}
		if (Math.random() < switchToolsChance) {
			let multiToolsPlz = Math.random() < multiToolsChance;
			$(choose($(".tool, tool-button"))).trigger($.Event("click", {shiftKey: multiToolsPlz}));
		}
		if (Math.random() < pickToolOptionsChance) {
			$(choose($(".tool-options *"))).trigger("click");
		}
		if (Math.random() < pickColorChance) {
			// TODO: maybe these should respond to a normal click?
			let secondary = Math.random() < 0.5;
			var colorButton = choose($(".swatch, .color-button"));
			$(colorButton)
				.trigger($.Event("pointerdown", {button: secondary ? 2 : 0}))
				.trigger($.Event("click", {button: secondary ? 2 : 0}))
				.trigger($.Event("pointerup", {button: secondary ? 2 : 0}));
		}
		if (Math.random() < scrollChance) {
			let scrollAmount = (Math.random() * 2 - 1) * 700;
			if (Math.random() < 0.5) {
				$canvas_area.scrollTop($canvas_area.scrollTop() + scrollAmount);
			} else {
				$canvas_area.scrollLeft($canvas_area.scrollLeft() + scrollAmount);
			}
		}
		periodicGesturesTimeoutID = setTimeout(() => {
			_simulateRandomGesture(()=> {
				if (selection && Math.random() < dragSelectionChance) {
					window.simulateRandomGesture(waitThenGo, {
						shift: shiftStart,
						shiftToggleChance,
						secondary: secondaryStart,
						secondaryToggleChance,
						target: selection.canvas
					});
				} else {
					waitThenGo();
				}
			});
		}, delayBetweenGestures);
	};
	_simulateRandomGesture(waitThenGo);
};

window.stopSimulatingGestures = () => {
	if (window.simulatingGestures) {
		clearTimeout(gestureTimeoutID);
		clearTimeout(periodicGesturesTimeoutID);
		window.simulatingGestures = false;
		$status_text.default();
	}
};

})();
