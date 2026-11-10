import { useState, type FormEvent } from 'react';

// 表单自己只管“输入框里正在打什么”，点添加时把纯文本通过 onAdd 交给父组件。
export interface TodoFormProps {
  onAdd: (text: string) => void;
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onAdd(text);
    // 纯空白也清空：addTodo 会在领域层拦掉，UI 不需要重复判断业务规则。
    setText('');
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        aria-label="任务内容"
        placeholder="要做什么？"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <button type="submit">添加</button>
    </form>
  );
}
