const TIMELINE_ID = "_timeLine";
const TASK_COMPLETE_CLASS = "taskComplete";
const MESSAGE_ID_PREFIX = "_messageId";
const SPEAKER_CLASS = "_speaker";

function getAllTaskCompleteMessage() {
	const evaluateResult = document.evaluate(
	    `//div[contains(@class,"${TASK_COMPLETE_CLASS}")]/ancestor::div[contains(@id, "${MESSAGE_ID_PREFIX}")][not(preceding-sibling::h2)]`,
		document,
		null,
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
	);
	return [...Array(evaluateResult.snapshotLength)].map((_, i) =>
		evaluateResult.snapshotItem(i),
	);
}

function getNextMessage(message) {
	const evaluateResult = document.evaluate(
		`//div[@id="${message.id}"]/following-sibling::div[contains(@id, "${MESSAGE_ID_PREFIX}")]`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
	);
	return evaluateResult.singleNodeValue;
}

function messageHasSpeaker(message) {
	const evaluateResult = document.evaluate(
		`//div[@id="${message.id}"]//div[contains(@class, "${SPEAKER_CLASS}")]`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
	);
	return evaluateResult.singleNodeValue !== null;
}

function getIconElement(message) {
	const evaluateResult = document.evaluate(
		`//div[@id="${message.id}"]/div/div[1]`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
	);
	return evaluateResult.singleNodeValue.cloneNode(true);
}

function getNameElement(message) {
	const evaluateResult = document.evaluate(
		`//div[@id="${message.id}"]/div/div[2]/div[1]`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
	);
	return evaluateResult.singleNodeValue.cloneNode(true);
}

function appendSpeaker(message, icon, name) {
	message.children[0].prepend(icon);
	message.children[0].children[1].prepend(name);
}

function deleteMessageContext(message) {
	message.hidden = true;
}

function muteTaskComplete() {
	const messages = getAllTaskCompleteMessage();
	for (const message of messages) {
		if (message.hidden) {
			continue;
		}
		// 消すメッセージがアイコンを持たないなら即削除
		if (!messageHasSpeaker(message)) {
			deleteMessageContext(message);
			continue;
		}
		const nextMessage = getNextMessage(message);
		// 次のメッセージが無いか削除済みなら即削除
		if (!nextMessage || nextMessage.hidden) {
			deleteMessageContext(message);
			continue;
		}
		// 次のメッセージがアイコンを持たないなら付け替え
		if (!messageHasSpeaker(nextMessage)) {
			const iconElement = getIconElement(message);
			const nameElement = getNameElement(message);
			appendSpeaker(nextMessage, iconElement, nameElement);
		}
		deleteMessageContext(message);
	}
}
function main() {
	// DOMが読み込めてなかったら1秒後にリトライ
	if (!document.getElementById(TIMELINE_ID)) {
		setTimeout(main, 1000);
		return;
	}

	const observer = new MutationObserver(muteTaskComplete);

	observer.observe(document.getElementById(TIMELINE_ID), {
		attributes: true,
		childList: true,
		subtree: true,
	});

	muteTaskComplete();
}

main();
