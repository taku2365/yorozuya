import { v4 as uuidv4 } from "uuid";
import type { Database } from "../db/database";
import type { KanbanCard, KanbanLane } from "../db/types";

export interface CreateLaneDto {
  title: string;
  position?: number;
  wip_limit?: number;
}

export interface UpdateLaneDto {
  title?: string;
  position?: number;
  wip_limit?: number;
}

export interface CreateCardDto {
  title: string;
  description?: string;
  lane_id: string;
  position?: number;
  labels?: string;
  todo_id?: string;
}

export interface UpdateCardDto {
  title?: string;
  description?: string;
  labels?: string;
  todo_id?: string;
}

export class KanbanRepository {
  constructor(private db: Database) {}

  // Lane operations
  async createLane(data: CreateLaneDto): Promise<KanbanLane> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const lane: KanbanLane = {
      id,
      title: data.title,
      position: data.position ?? 0,
      wip_limit: data.wip_limit,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO kanban_lanes (id, title, position, wip_limit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        lane.id,
        lane.title,
        lane.position,
        lane.wip_limit || null,
        lane.created_at,
        lane.updated_at,
      ]
    );

    return lane;
  }

  async findAllLanes(): Promise<KanbanLane[]> {
    const rows = await this.db.execute(
      "SELECT * FROM kanban_lanes ORDER BY position",
      []
    );

    return rows.map(this.mapRowToLane);
  }

  async findLaneById(id: string): Promise<KanbanLane | null> {
    const rows = await this.db.execute(
      "SELECT * FROM kanban_lanes WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToLane(rows[0]);
  }

  async updateLane(id: string, data: UpdateLaneDto): Promise<KanbanLane | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.position !== undefined) {
      fields.push("position = ?");
      params.push(data.position);
    }

    if (data.wip_limit !== undefined) {
      fields.push("wip_limit = ?");
      params.push(data.wip_limit);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE kanban_lanes SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);
    
    // Return the updated lane
    return this.findLaneById(id);
  }

  async deleteLane(id: string): Promise<void> {
    // Delete all cards in the lane first
    await this.db.execute("DELETE FROM kanban_cards WHERE lane_id = ?", [id]);
    
    // Then delete the lane
    await this.db.execute("DELETE FROM kanban_lanes WHERE id = ?", [id]);
  }

  // Card operations
  async createCard(data: CreateCardDto): Promise<KanbanCard> {
    // Check WIP limit
    await this.checkWipLimit(data.lane_id);

    const id = uuidv4();
    const now = new Date().toISOString();
    
    const card: KanbanCard = {
      id,
      title: data.title,
      description: data.description,
      lane_id: data.lane_id,
      position: data.position ?? 0,
      labels: data.labels,
      todo_id: data.todo_id,
      created_at: now,
      updated_at: now,
    };

    await this.db.execute(
      `INSERT INTO kanban_cards (id, title, description, lane_id, position, labels, todo_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        card.id,
        card.title,
        card.description || null,
        card.lane_id,
        card.position,
        card.labels || null,
        card.todo_id || null,
        card.created_at,
        card.updated_at,
      ]
    );

    return card;
  }

  async findAllCards(includeArchived: boolean = false): Promise<KanbanCard[]> {
    let query = "SELECT * FROM kanban_cards";
    if (!includeArchived) {
      query += " WHERE (archived IS NULL OR archived = 0)";
    }
    query += " ORDER BY lane_id, position";
    
    const rows = await this.db.execute(query, []);
    return rows.map(this.mapRowToCard);
  }

  async findCardsByLane(laneId: string): Promise<KanbanCard[]> {
    const rows = await this.db.execute(
      "SELECT * FROM kanban_cards WHERE lane_id = ? ORDER BY position",
      [laneId]
    );

    return rows.map(this.mapRowToCard);
  }

  async findCardById(id: string): Promise<KanbanCard | null> {
    const rows = await this.db.execute(
      "SELECT * FROM kanban_cards WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCard(rows[0]);
  }

  async moveCard(cardId: string, targetLaneId: string, newPosition: number): Promise<void> {
    // Check WIP limit for target lane
    await this.checkWipLimit(targetLaneId, cardId);

    await this.db.execute(
      "UPDATE kanban_cards SET lane_id = ?, position = ?, updated_at = ? WHERE id = ?",
      [targetLaneId, newPosition, new Date().toISOString(), cardId]
    );
  }

  async updateCard(id: string, data: UpdateCardDto): Promise<KanbanCard | null> {
    const fields: string[] = [];
    const params: any[] = [];

    if (data.title !== undefined) {
      fields.push("title = ?");
      params.push(data.title);
    }

    if (data.description !== undefined) {
      fields.push("description = ?");
      params.push(data.description);
    }

    if (data.labels !== undefined) {
      fields.push("labels = ?");
      params.push(data.labels);
    }

    if (data.todo_id !== undefined) {
      fields.push("todo_id = ?");
      params.push(data.todo_id);
    }

    fields.push("updated_at = ?");
    params.push(new Date().toISOString());

    params.push(id);

    const sql = `UPDATE kanban_cards SET ${fields.join(", ")} WHERE id = ?`;
    await this.db.execute(sql, params);
    
    // Return the updated card
    return this.findCardById(id);
  }

  async deleteCard(id: string): Promise<void> {
    await this.db.execute("DELETE FROM kanban_cards WHERE id = ?", [id]);
  }

  async archiveCard(id: string): Promise<void> {
    await this.db.execute(
      "UPDATE kanban_cards SET archived = 1, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  }

  async unarchiveCard(id: string): Promise<void> {
    await this.db.execute(
      "UPDATE kanban_cards SET archived = 0, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id]
    );
  }

  async findArchivedCards(): Promise<KanbanCard[]> {
    const rows = await this.db.execute(
      "SELECT * FROM kanban_cards WHERE archived = 1 ORDER BY updated_at DESC",
      []
    );
    return rows.map(this.mapRowToCard);
  }

  async searchCards(keyword: string): Promise<KanbanCard[]> {
    const searchPattern = `%${keyword}%`;
    const rows = await this.db.execute(
      "SELECT * FROM kanban_cards WHERE (title LIKE ? OR description LIKE ?) ORDER BY created_at DESC",
      [searchPattern, searchPattern]
    );

    return rows.map(this.mapRowToCard);
  }

  async findCardsByLabel(label: string): Promise<KanbanCard[]> {
    const labelPattern = `%${label}%`;
    const rows = await this.db.execute(
      "SELECT * FROM kanban_cards WHERE labels LIKE ? ORDER BY created_at DESC",
      [labelPattern]
    );

    return rows.map(this.mapRowToCard);
  }

  // Board operations
  async getBoardData(): Promise<{ lanes: KanbanLane[]; cards: KanbanCard[] }> {
    const lanes = await this.findAllLanes();
    const cards = await this.db.execute(
      "SELECT * FROM kanban_cards ORDER BY lane_id, position",
      []
    );

    return {
      lanes,
      cards: cards.map(this.mapRowToCard),
    };
  }

  // Helper methods
  private async checkWipLimit(laneId: string, excludeCardId?: string): Promise<void> {
    const lanes = await this.db.execute(
      "SELECT * FROM kanban_lanes WHERE id = ?",
      [laneId]
    );

    if (lanes.length === 0) {
      throw new Error("Lane not found");
    }

    const lane = lanes[0];
    if (lane.wip_limit) {
      let cardsQuery = "SELECT id FROM kanban_cards WHERE lane_id = ?";
      const params: any[] = [laneId];
      
      if (excludeCardId) {
        cardsQuery += " AND id != ?";
        params.push(excludeCardId);
      }

      const cards = await this.db.execute(cardsQuery, params);
      
      if (cards.length >= lane.wip_limit) {
        throw new Error("WIP limit exceeded");
      }
    }
  }

  private mapRowToLane(row: any): KanbanLane {
    return {
      id: row.id,
      title: row.title,
      position: row.position,
      wip_limit: row.wip_limit || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapRowToCard(row: any): KanbanCard {
    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      lane_id: row.lane_id,
      position: row.position,
      labels: row.labels || undefined,
      todo_id: row.todo_id || undefined,
      archived: Boolean(row.archived),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}