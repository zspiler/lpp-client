<template>
  <div class="card" :style="{ background: color }">
    <div class="route-number-icon">
      <div :style="{ color }">
        {{ bus.route_number }}
      </div>
    </div>
    <h4> {{ bus.route_name }} </h4>
    <p>To: {{ bus.destination }}</p>
  </div>
</template>

<script>
export default {
  name: 'BusInfoCard',
  props: {
    color: {
      type: String,
      default: '#bbbbbb',
    },
    bus: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {

    };
  },
};
</script>

<style scoped>
.card {
  color: white;
  opacity: 0.85;
  border-radius: 2em;
  z-index: 9999;
  text-align: center;
  width: 350px;
  backdrop-filter: blur(10px);
}
.route-number-icon {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  margin: 10px auto;
  width: 40px;
  height: 40px;
  border-radius: 50%;
}
</style>
