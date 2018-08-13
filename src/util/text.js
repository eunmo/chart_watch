export default class TextUtil {
	static normalize(string) {
		return string.replace(/`/g, '\'');
	}
}
