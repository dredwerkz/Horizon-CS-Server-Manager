import React from "react";
import { render, screen, act } from "@testing-library/react";
import ServerContainer from "./ServerContainer";

// --- WebSocket mock ---
let mockInstances = [];

class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING;
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        this.send = jest.fn();
        this.close = jest.fn(() => {
            this.readyState = MockWebSocket.CLOSED;
        });
        mockInstances.push(this);
    }

    simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        this.onopen && this.onopen({});
    }

    simulateMessage(data) {
        this.onmessage && this.onmessage({ data: JSON.stringify(data) });
    }

    simulateClose(code = 1006, reason = "") {
        this.readyState = MockWebSocket.CLOSED;
        this.onclose && this.onclose({ code, reason });
    }
}

// Attach static constants to prototype for readyState comparisons
MockWebSocket.prototype.CONNECTING = 0;
MockWebSocket.prototype.OPEN = 1;
MockWebSocket.prototype.CLOSING = 2;
MockWebSocket.prototype.CLOSED = 3;

beforeEach(() => {
    mockInstances = [];
    global.WebSocket = MockWebSocket;
    jest.useFakeTimers();
});

afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    delete global.WebSocket;
});

function latestWs() {
    return mockInstances[mockInstances.length - 1];
}

const sampleServer = {
    ServerKey: "192.168.1.10:27015",
    Map: "de_dust2",
    ScoreCt: 8,
    ScoreT: 5,
    Rounds: 13,
    Admin: false,
    PlayersCt: ["Alice"],
    PlayersT: ["Bob"],
};

describe("ServerContainer", () => {
    test("shows 'Reconnecting...' status on initial render", () => {
        render(<ServerContainer />);
        expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
    });

    test("shows 'Connecting to server...' message when connecting with no data", () => {
        render(<ServerContainer />);
        expect(screen.getByText("Connecting to server...")).toBeInTheDocument();
    });

    test("shows 'Connected' after WebSocket opens", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    test("sends NEW_USER message on connect", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        expect(latestWs().send).toHaveBeenCalledWith(
            JSON.stringify({ type: "NEW_USER" })
        );
    });

    test("shows 'Waiting for server data...' when connected with no server data", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        expect(screen.getByText("Waiting for server data...")).toBeInTheDocument();
    });

    test("renders server data from SERVERS message", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });

        expect(screen.getByText(/192\.168\.1\.10:27015/)).toBeInTheDocument();
        expect(screen.getByText("de_dust2")).toBeInTheDocument();
        expect(screen.getByText("8")).toBeInTheDocument();
        expect(screen.getByText("5")).toBeInTheDocument();
    });

    test("updates server data from UPDATE message", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });

        act(() => {
            latestWs().simulateMessage({
                type: "UPDATE",
                payload: { ServerKey: "192.168.1.10:27015", ScoreCt: 10 },
            });
        });

        expect(screen.getByText("10")).toBeInTheDocument();
    });

    test("adds new server from UPDATE message", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });

        act(() => {
            latestWs().simulateMessage({
                type: "UPDATE",
                payload: { ServerKey: "10.0.0.1:27015", Map: "de_mirage", ScoreCt: 3, ScoreT: 2 },
            });
        });

        expect(screen.getByText(/10\.0\.0\.1:27015/)).toBeInTheDocument();
        expect(screen.getByText("de_mirage")).toBeInTheDocument();
    });

    test("transitions to 'Reconnecting...' after abnormal close (reconnect scheduled)", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        act(() => latestWs().simulateClose(1006));
        // scheduleReconnect sets status back to 'connecting' synchronously
        expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
    });

    test("shows 'Disconnected' on clean close (code 1000)", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        act(() => latestWs().simulateClose(1000, "Server shutdown"));
        expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    test("shows error message when disconnected with no data (clean close)", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        act(() => latestWs().simulateClose(1000));
        expect(screen.getByText("Unable to reach server. Retrying...")).toBeInTheDocument();
    });

    test("shows warning with stale data on clean close after receiving data", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });
        act(() => latestWs().simulateClose(1000));

        expect(screen.getByText("Connection lost. Showing last known data. Reconnecting...")).toBeInTheDocument();
        // Server data is still visible
        expect(screen.getByText(/192\.168\.1\.10:27015/)).toBeInTheDocument();
    });

    test("preserves server data during reconnect after abnormal close", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });
        act(() => latestWs().simulateClose(1006));

        // Data is still rendered while reconnecting
        expect(screen.getByText(/192\.168\.1\.10:27015/)).toBeInTheDocument();
        expect(screen.getByText("de_dust2")).toBeInTheDocument();
    });

    test("schedules reconnect with exponential backoff on abnormal close", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());

        const initialCount = mockInstances.length;
        act(() => latestWs().simulateClose(1006));

        // No immediate reconnect
        expect(mockInstances.length).toBe(initialCount);

        // After first timer fires (~1s base), a new WebSocket should be created
        act(() => jest.advanceTimersByTime(2000));
        expect(mockInstances.length).toBe(initialCount + 1);
    });

    test("does NOT reconnect on clean close (code 1000)", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());

        const initialCount = mockInstances.length;
        act(() => latestWs().simulateClose(1000, "Component unmounting"));

        act(() => jest.advanceTimersByTime(35000));
        expect(mockInstances.length).toBe(initialCount);
    });

    test("resets reconnect attempts after successful reconnect", () => {
        render(<ServerContainer />);
        act(() => latestWs().simulateOpen());

        // First disconnect → reconnect
        act(() => latestWs().simulateClose(1006));
        act(() => jest.advanceTimersByTime(2000));
        const reconnectedWs = latestWs();

        // Simulate successful reconnect
        act(() => reconnectedWs.simulateOpen());
        expect(screen.getByText("Connected")).toBeInTheDocument();

        // Second disconnect should use base delay again (not escalated)
        const countBefore = mockInstances.length;
        act(() => reconnectedWs.simulateClose(1006));
        act(() => jest.advanceTimersByTime(2000));
        expect(mockInstances.length).toBe(countBefore + 1);
    });

    test("handles ADMIN_UPDATE message", () => {
        render(<ServerContainer />);
        act(() => {
            latestWs().simulateOpen();
            latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
        });

        act(() => {
            latestWs().simulateMessage({
                type: "ADMIN_UPDATE",
                payload: { ServerKey: "192.168.1.10:27015", Admin: true },
            });
        });

        expect(screen.getByText("❗")).toBeInTheDocument();
    });

    test("cleans up WebSocket on unmount", () => {
        const { unmount } = render(<ServerContainer />);
        const ws = latestWs();
        act(() => ws.simulateOpen());

        unmount();

        expect(ws.close).toHaveBeenCalledWith(1000, "Component unmounting");
    });

    test("clears reconnect timer on unmount", () => {
        const { unmount } = render(<ServerContainer />);
        act(() => latestWs().simulateOpen());
        act(() => latestWs().simulateClose(1006));

        const countBefore = mockInstances.length;
        unmount();

        // Timer should be cleared, no new WebSocket created
        act(() => jest.advanceTimersByTime(35000));
        expect(mockInstances.length).toBe(countBefore);
    });
});
