import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegratedSidebar } from '../integrated-sidebar';

describe('IntegratedSidebar', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onProjectSelect: vi.fn(),
    onTagSelect: vi.fn(),
    onMemberSelect: vi.fn(),
  };

  it('サイドバーが正しくレンダリングされる', () => {
    render(<IntegratedSidebar {...defaultProps} />);
    
    expect(screen.getByTestId('integrated-sidebar')).toBeInTheDocument();
    expect(screen.getByText('プロジェクト')).toBeInTheDocument();
    expect(screen.getByText('タグ')).toBeInTheDocument();
    expect(screen.getByText('メンバー')).toBeInTheDocument();
    expect(screen.getByText('カレンダー')).toBeInTheDocument();
  });

  it('閉じるボタンが機能する', () => {
    render(<IntegratedSidebar {...defaultProps} />);
    
    const closeButton = screen.getByLabelText('サイドバーを閉じる');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('プロジェクト一覧が表示される', () => {
    const projects = [
      { id: 'proj-1', name: 'プロジェクトA', color: 'blue' },
      { id: 'proj-2', name: 'プロジェクトB', color: 'green' },
    ];
    
    render(<IntegratedSidebar {...defaultProps} projects={projects} />);
    
    expect(screen.getByText('プロジェクトA')).toBeInTheDocument();
    expect(screen.getByText('プロジェクトB')).toBeInTheDocument();
  });

  it('プロジェクトをクリックすると選択される', () => {
    const projects = [
      { id: 'proj-1', name: 'プロジェクトA', color: 'blue' },
    ];
    
    render(<IntegratedSidebar {...defaultProps} projects={projects} />);
    
    fireEvent.click(screen.getByText('プロジェクトA'));
    
    expect(defaultProps.onProjectSelect).toHaveBeenCalledWith('proj-1');
  });

  it('タグ一覧が表示される', () => {
    const tags = [
      { name: 'urgent', count: 5, color: 'red' },
      { name: 'bug', count: 3, color: 'orange' },
    ];
    
    render(<IntegratedSidebar {...defaultProps} tags={tags} />);
    
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByTestId('tag-urgent')).toHaveTextContent('urgent5');
    expect(screen.getByText('bug')).toBeInTheDocument();
    expect(screen.getByTestId('tag-bug')).toHaveTextContent('bug3');
  });

  it('タグをクリックすると選択される', () => {
    const tags = [
      { name: 'urgent', count: 5, color: 'red' },
    ];
    
    render(<IntegratedSidebar {...defaultProps} tags={tags} />);
    
    fireEvent.click(screen.getByText('urgent'));
    
    expect(defaultProps.onTagSelect).toHaveBeenCalledWith('urgent');
  });

  it('メンバー一覧が表示される', () => {
    const members = [
      { id: 'user-1', name: '田中太郎', avatar: '/avatar1.png', taskCount: 10 },
      { id: 'user-2', name: '佐藤花子', avatar: '/avatar2.png', taskCount: 8 },
    ];
    
    render(<IntegratedSidebar {...defaultProps} members={members} />);
    
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('10 タスク')).toBeInTheDocument();
    expect(screen.getByText('佐藤花子')).toBeInTheDocument();
    expect(screen.getByText('8 タスク')).toBeInTheDocument();
  });

  it('メンバーをクリックすると選択される', () => {
    const members = [
      { id: 'user-1', name: '田中太郎', avatar: '/avatar1.png', taskCount: 10 },
    ];
    
    render(<IntegratedSidebar {...defaultProps} members={members} />);
    
    fireEvent.click(screen.getByText('田中太郎'));
    
    expect(defaultProps.onMemberSelect).toHaveBeenCalledWith('user-1');
  });

  it('カレンダーが表示される', () => {
    render(<IntegratedSidebar {...defaultProps} />);
    
    expect(screen.getByTestId('sidebar-calendar')).toBeInTheDocument();
  });

  it('今日の日付がハイライトされる', () => {
    render(<IntegratedSidebar {...defaultProps} />);
    
    // カレンダーが存在することを確認
    const calendar = screen.getByTestId('sidebar-calendar');
    expect(calendar).toBeInTheDocument();
    
    // 今日の日付要素を探す
    const todayElements = calendar.querySelectorAll('[data-today="true"]');
    expect(todayElements.length).toBeGreaterThan(0);
    
    // 最初の今日の日付要素がハイライトクラスを持つことを確認
    expect(todayElements[0]).toHaveClass('bg-primary');
  });

  it('折りたたみ可能なセクションが機能する', () => {
    render(<IntegratedSidebar {...defaultProps} />);
    
    // プロジェクトセクションを折りたたむ
    const projectToggle = screen.getByTestId('toggle-projects');
    fireEvent.click(projectToggle);
    
    expect(screen.queryByText('プロジェクトA')).not.toBeInTheDocument();
    
    // 再度クリックで展開
    fireEvent.click(projectToggle);
    expect(screen.getByText('プロジェクト')).toBeInTheDocument();
  });

  it('モバイルモードでオーバーレイが表示される', () => {
    render(<IntegratedSidebar {...defaultProps} isMobile />);
    
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
  });

  it('オーバーレイをクリックするとサイドバーが閉じる', () => {
    render(<IntegratedSidebar {...defaultProps} isMobile />);
    
    const overlay = screen.getByTestId('sidebar-overlay');
    fireEvent.click(overlay);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('サイドバーが閉じている時は表示されない', () => {
    render(<IntegratedSidebar {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('integrated-sidebar')).not.toBeInTheDocument();
  });

  it('選択されたプロジェクトがハイライトされる', () => {
    const projects = [
      { id: 'proj-1', name: 'プロジェクトA', color: 'blue' },
      { id: 'proj-2', name: 'プロジェクトB', color: 'green' },
    ];
    
    render(
      <IntegratedSidebar
        {...defaultProps}
        projects={projects}
        selectedProjectId="proj-1"
      />
    );
    
    const selectedProject = screen.getByTestId('project-proj-1');
    expect(selectedProject).toHaveClass('bg-accent');
  });

  it('選択されたタグがハイライトされる', () => {
    const tags = [
      { name: 'urgent', count: 5, color: 'red' },
      { name: 'bug', count: 3, color: 'orange' },
    ];
    
    render(
      <IntegratedSidebar
        {...defaultProps}
        tags={tags}
        selectedTags={['urgent']}
      />
    );
    
    const selectedTag = screen.getByTestId('tag-urgent');
    expect(selectedTag).toHaveClass('ring-2');
  });

  it('選択されたメンバーがハイライトされる', () => {
    const members = [
      { id: 'user-1', name: '田中太郎', avatar: '/avatar1.png', taskCount: 10 },
      { id: 'user-2', name: '佐藤花子', avatar: '/avatar2.png', taskCount: 8 },
    ];
    
    render(
      <IntegratedSidebar
        {...defaultProps}
        members={members}
        selectedMemberIds={['user-1']}
      />
    );
    
    const selectedMember = screen.getByTestId('member-user-1');
    expect(selectedMember).toHaveClass('bg-accent');
  });
});