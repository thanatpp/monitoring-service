<template>
  <div class="container">
    <div v-for="(s, i) in listStatus" class="item">
      <div>id: {{ s.id }}</div>
      <div>status: {{ s.status }}</div>
      <div>estimate: {{ estimate(s) }}D</div>
      <UProgress
        animation="carousel"
        size="xl"
        :indicator="!isWaitingProgress(s.status)"
        :value="isWaitingProgress(s.status) ? undefined : s.progress"
        :max="isWaitingProgress(s.status) ? undefined : s.maxItem"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const ws = new WebSocket("ws://localhost:8080/status");

type Status = {
  id: string;
  status: string;
  maxItem: number;
  progress: number;
  avgProcessTime: number;
  lastUpdate: string;
};

const listStatus = ref<Status[]>([]);

onMounted(() => {
  ws.onmessage = ({ data }) => {
    listStatus.value = data;
    listStatus.value = JSON.parse(data);
  };

  ws.onopen = () => {
    console.log("connect to server success");
    ws.send("");
  };
});

const estimate = (s: Status) => {
  const task = s.maxItem - s.progress;
  const es = (task / 10000) * s.avgProcessTime;
  const esDay = es / 60 / 60 / 24;
  return Math.round(esDay * 100) / 100;
};

const isWaitingProgress = (s: string) => {
  return ["STOP", "WAITING"].includes(s);
};
</script>

<style scoped lang="scss">
.container {
  padding: 16px;
  margin: auto;
  max-width: 500px;
}

.item {
  display: block;
  padding-top: 16px;
}
</style>
