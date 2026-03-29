import pytest
from fastapi import HTTPException

from app.routers.posts import add_reaction, ensure_post_exists, remove_reaction


class Result:
    def __init__(self, data):
        self.data = data


class FakeTableQuery:
    def __init__(self, store, table_name):
        self.store = store
        self.table_name = table_name
        self.operation = "select"
        self.filters = {}
        self.payload = None

    def select(self, _columns):
        self.operation = "select"
        return self

    def eq(self, field, value):
        self.filters[field] = value
        return self

    def insert(self, payload):
        self.operation = "insert"
        self.payload = payload
        return self

    def delete(self):
        self.operation = "delete"
        return self

    def execute(self):
        rows = self.store[self.table_name]

        if self.operation == "select":
            filtered = [
                row for row in rows
                if all(row.get(key) == value for key, value in self.filters.items())
            ]
            return Result(filtered)

        if self.operation == "insert":
            next_row = {"id": f"{self.table_name}-{len(rows) + 1}", **self.payload}
            rows.append(next_row)
            return Result([next_row])

        if self.operation == "delete":
            kept = []
            deleted = []
            for row in rows:
                if all(row.get(key) == value for key, value in self.filters.items()):
                    deleted.append(row)
                else:
                    kept.append(row)
            self.store[self.table_name] = kept
            return Result(deleted)

        raise AssertionError(f"Unsupported operation: {self.operation}")


class FakeSupabase:
    def __init__(self):
        self.store = {
            "posts": [{"id": "post-1"}],
            "post_reactions": [],
        }

    def table(self, table_name):
        return FakeTableQuery(self.store, table_name)


def test_ensure_post_exists_raises_on_missing_post():
    supabase = FakeSupabase()

    with pytest.raises(HTTPException) as exc:
        ensure_post_exists("missing-post", supabase)

    assert exc.value.status_code == 404


def test_add_reaction_inserts_and_blocks_duplicates():
    supabase = FakeSupabase()

    created = add_reaction("post-1", "like", "user-1", supabase)
    assert created["reaction_type"] == "like"
    assert len(supabase.store["post_reactions"]) == 1

    with pytest.raises(HTTPException) as exc:
        add_reaction("post-1", "like", "user-1", supabase)

    assert exc.value.status_code == 409


def test_remove_reaction_deletes_existing_reaction():
    supabase = FakeSupabase()
    add_reaction("post-1", "love", "user-2", supabase)

    remove_reaction("post-1", "love", "user-2", supabase)
    assert len(supabase.store["post_reactions"]) == 0

    with pytest.raises(HTTPException) as exc:
        remove_reaction("post-1", "love", "user-2", supabase)

    assert exc.value.status_code == 404
