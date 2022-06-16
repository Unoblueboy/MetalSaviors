export class MetalSaviorsChatMessage extends ChatMessage {
	async _renderRollContent(messageData) {
		const data = messageData.message;

		// Always show a "rolled privately" message if the Roll content is not visible to the current user
		if (!this.isContentVisible) {
			data.flavor = game.i18n.format("CHAT.PrivateRollContent", { user: this.user.name });
			const roll = this.roll ?? new Roll("d6");
			data.content = await roll.render({ isPrivate: true });
			messageData.isWhisper = false;
			messageData.alias = this.user.name;
		}

		// Determine whether a visible roll message has custom HTML content, otherwise render the Roll to HTML
		else {
			const hasContent =
				(this.roll && data.content && Number(data.content) !== this.roll.total) || (!this.roll && data.content);
			if (!hasContent) data.content = await this.roll.render({ isPrivate: false });
		}
	}

	export() {
		let content = [];

		// Handle Roll content
		if (this.roll && this.isRoll) {
			let r = this.roll;
			if (this.data.content && this.data.content !== "undefined") {
				content.push($(`<div>${this.data.content}</div>`).text().trim());
			}
			let flavor = this.data.flavor;
			if (flavor && flavor !== r.formula) content.push(flavor);
			content.push(`${r.formula} = ${r.result} = ${r.total}`);
		}

		// Handle HTML content
		else {
			const html = $("<article>").html(this.data["content"].replace(/<\/div>/g, "</div>|n"));
			const text = html.length ? html.text() : this.data["content"];
			const lines = text
				.replace(/\n/g, "")
				.split("  ")
				.filter((p) => p !== "")
				.join(" ");
			content = lines.split("|n").map((l) => l.trim());
		}

		// Author and timestamp
		const time = new Date(this.data.timestamp).toLocaleDateString("en-US", {
			hour: "numeric",
			minute: "numeric",
			second: "numeric",
		});

		// Format logged result
		return `[${time}] ${this.alias}\n${content.filterJoin("\n")}`;
	}
}
