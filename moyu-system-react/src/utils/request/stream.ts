export async function fetchAndReadStream(
  url: string,
  content: any,
  onReceived: (chunk: string) => void,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  if (!response.body) {
    throw new Error("Network response is null");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      console.log("Finished reading the response.");
      break;
    }
    const chunk = decoder.decode(value, { stream: true });
    // 调用回调函数处理数据块
    onReceived(chunk);
  }
}
